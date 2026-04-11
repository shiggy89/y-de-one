import Image from "next/image";
import styles from "./Hero.module.css";

type Props = {
	title: string
	subtitle: string
}
export default function Hero({ title, subtitle }: Props) {
	const [titleFirst = title, titleSecond = ""] = title.split(" ");

	return (
		<section className={styles.pageHero}>
			<div className={styles.heroInner}>
				<div className={styles.innerPageHero}>
				<Image
					className={styles.dogIcon}
					src="/images/class/dog-icon.png"
					alt="犬のアイコン"
					width={555}
					height={427}
				/>
				<Image
					className={styles.leftTeacherIcon}
					src="/images/class/kazuki-dog-icon.png"
					alt="先生のアイコン"
					width={430}
					height={486}
				/>
				<Image
					className={styles.rightTeacherIcon}
					src="/images/class/yoshiki-idea-red-icon.png"
					alt="先生のアイコン"
					width={500}
					height={500}
				/>
				<h2 className={styles.title}>
					<span className={styles.titleTop}>{titleFirst}</span>
					{titleSecond && (
						<>
							<br className={styles.mobileBreak} />
							<span className={styles.titleBottom}>{titleSecond}</span>
						</>
					)}
					<br />
					{ subtitle }
				</h2>
				</div>
			</div>
		</section>
	);
}
